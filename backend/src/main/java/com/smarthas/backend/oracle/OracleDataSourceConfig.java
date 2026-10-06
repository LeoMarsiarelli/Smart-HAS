package com.smarthas.backend.oracle;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Datasource independente para a camada de inteligência Oracle (Fase 6).
 * <p>
 * Só é criado quando {@code smarthas.oracle.enabled=true} (profile
 * {@code oracle}). Deliberadamente separado do datasource principal usado
 * pelo Spring Data JPA (H2 em dev / PostgreSQL em produção): o Oracle entra
 * nesta fase como uma camada adicional de regras de negócio em PL/SQL
 * (functions/procedures), não como substituto do armazenamento operacional
 * já em produção — ver roadmap em docs/.
 * <p>
 * Nota técnica: ao declarar um bean {@link DataSource} próprio, a
 * auto-configuração padrão do Spring Boot deixa de criar o datasource
 * principal (ela só age quando nenhum {@link DataSource} já existe no
 * contexto). Por isso este arquivo também recria explicitamente — e marca
 * como {@link Primary} — o datasource principal a partir das mesmas
 * propriedades {@code spring.datasource.*} de sempre (via
 * {@link DataSourceProperties}, que sabe mapear {@code url} para
 * {@code jdbcUrl} no Hikari), garantindo que o JPA continue apontando para
 * H2/Postgres e nunca para o Oracle.
 */
@Configuration
@ConditionalOnProperty(prefix = "smarthas.oracle", name = "enabled", havingValue = "true")
public class OracleDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    public DataSource primaryDataSource(DataSourceProperties primaryDataSourceProperties) {
        return primaryDataSourceProperties.initializeDataSourceBuilder().build();
    }

    @Bean(name = "oracleDataSource")
    public DataSource oracleDataSource(
            @Value("${smarthas.oracle.url}") String url,
            @Value("${smarthas.oracle.username}") String username,
            @Value("${smarthas.oracle.password}") String password
    ) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("oracle.jdbc.OracleDriver");
        config.setPoolName("oracle-intelligence-pool");
        config.setMaximumPoolSize(5);
        return new HikariDataSource(config);
    }

    @Bean(name = "oracleJdbcTemplate")
    public JdbcTemplate oracleJdbcTemplate(@Qualifier("oracleDataSource") DataSource oracleDataSource) {
        return new JdbcTemplate(oracleDataSource);
    }
}
